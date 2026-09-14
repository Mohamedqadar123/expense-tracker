// Recharts renders SVG with color values passed as JS props (fill/stroke),
// which can't read CSS custom properties directly. This module mirrors the
// same semantic colors defined in src/index.css for each theme, so charts
// stay visually consistent with the rest of the themed UI.
const CHART_COLORS = {
  light: {
    grid: '#e0e0e0',
    axis: '#888888',
    tooltipBg: '#ffffff',
    tooltipBorder: '#dddddd',
    tooltipText: '#333333',
    legendText: '#333333',
    income: '#2e7d32',
    expense: '#c62828',
    neutral: '#333333',
    net: '#1565c0',
    categorical: ['#333333', '#c62828', '#2e7d32', '#1565c0', '#f9a825', '#6a1b9a', '#00838f'],
  },
  dark: {
    grid: '#3a3a3a',
    axis: '#a8a8a8',
    tooltipBg: '#1e1e1e',
    tooltipBorder: '#3a3a3a',
    tooltipText: '#e8e8e8',
    legendText: '#e8e8e8',
    income: '#66bb6a',
    expense: '#ef5350',
    neutral: '#e0e0e0',
    net: '#64b5f6',
    categorical: ['#e0e0e0', '#ef5350', '#66bb6a', '#64b5f6', '#ffca28', '#ba68c8', '#4dd0e1'],
  },
};

export function getChartColors(resolvedTheme) {
  return CHART_COLORS[resolvedTheme] || CHART_COLORS.light;
}

export function getTooltipStyle(colors) {
  return {
    contentStyle: {
      background: colors.tooltipBg,
      border: `1px solid ${colors.tooltipBorder}`,
      color: colors.tooltipText,
      fontSize: 13,
      borderRadius: 4,
    },
    labelStyle: { color: colors.tooltipText },
    itemStyle: { color: colors.tooltipText },
  };
}
