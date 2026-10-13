import { buildMetaProxyUrl } from "./meta-proxy";

export interface ContributionMonthLabel {
  label: string;
  week: number;
}

export interface ContributionDay {
  count: number;
  date: string;
  isPlaceholder?: boolean;
  level: number;
  tooltip: string;
}

export interface GithubContributionCalendar {
  contributionCount: number;
  monthLabels: ContributionMonthLabel[];
  weekData: ContributionDay[][];
  profileUrl: string;
  sourceUrl: string;
}

const monthLabelPattern =
  /ContributionCalendar-label" colspan="(\d+)"[\s\S]*?<span aria-hidden="true"[^>]*>([^<]+)<\/span>/g;
const dayCellPattern =
  /data-date="(\d{4}-\d{2}-\d{2})" id="(contribution-day-component-(\d)-(\d+))" data-level="([0-4])"/g;
const tooltipPattern = /<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]+)<\/tool-tip>/g;
// GitHub 贡献页不允许跨域直连，走自建代理转发
export const buildContributionSourceUrl = (username: string) =>
  buildMetaProxyUrl(`https://github.com/users/${username}/contributions`);

const formatContributionTooltip = (date: string, count: number) => `${date} · ${count} 次提交`;

const parseContributionCount = (html: string) => {
  const matched = html.match(/<h2[^>]*id="js-contribution-activity-description"[\s\S]*?(\d[\d,]*)\s+contributions/i);

  if (!matched) {
    throw new Error("Unable to read GitHub contribution count.");
  }

  return Number.parseInt(matched[1].replaceAll(",", ""), 10);
};

const parseMonthLabels = (html: string) => {
  const labels: ContributionMonthLabel[] = [];
  let weekIndex = 0;

  for (const matched of html.matchAll(monthLabelPattern)) {
    labels.push({ label: matched[2], week: weekIndex });
    weekIndex += Number.parseInt(matched[1], 10);
  }

  if (!labels.length) {
    throw new Error("Unable to read GitHub month labels.");
  }

  return labels;
};

const parseContributionCellCount = (tooltipText: string) => {
  if (tooltipText.startsWith("No contributions")) {
    return 0;
  }

  const matched = tooltipText.match(/(\d[\d,]*)\s+contributions?\s+on/i);

  if (!matched) {
    throw new Error(`Unable to parse contribution count from tooltip: ${tooltipText}`);
  }

  return Number.parseInt(matched[1].replaceAll(",", ""), 10);
};

const parseWeekData = (html: string) => {
  const tooltipByCellId = new Map<string, string>();

  for (const matched of html.matchAll(tooltipPattern)) {
    tooltipByCellId.set(matched[1], matched[2].trim());
  }

  const weeks = new Map<number, Map<number, ContributionDay>>();

  for (const matched of html.matchAll(dayCellPattern)) {
    const date = matched[1];
    const cellId = matched[2];
    const row = Number.parseInt(matched[3], 10);
    const week = Number.parseInt(matched[4], 10);
    const level = Number.parseInt(matched[5], 10);
    const tooltipText = tooltipByCellId.get(cellId);

    if (!tooltipText) {
      throw new Error(`Missing tooltip for contribution cell ${cellId}.`);
    }

    const count = parseContributionCellCount(tooltipText);
    const weekDays = weeks.get(week) ?? new Map<number, ContributionDay>();

    weekDays.set(row, {
      count,
      date,
      level,
      tooltip: formatContributionTooltip(date, count),
    });

    weeks.set(week, weekDays);
  }

  if (!weeks.size) {
    throw new Error("Unable to read GitHub contribution grid.");
  }

  return [...weeks.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([, weekDays]) =>
      Array.from(
        { length: 7 },
        (_, row): ContributionDay =>
          weekDays.get(row) ?? {
            count: 0,
            date: "",
            isPlaceholder: true,
            level: 0,
            tooltip: "",
          },
      ),
    );
};

export const getGithubContributionCalendar = async (
  username = "ethanz-code",
): Promise<GithubContributionCalendar> => {
  const sourceUrl = buildContributionSourceUrl(username);
  const profileUrl = `https://github.com/${username}`;

  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}`);
  }

  const html = await response.text();

  return {
    contributionCount: parseContributionCount(html),
    monthLabels: parseMonthLabels(html),
    weekData: parseWeekData(html),
    profileUrl,
    sourceUrl,
  };
};
