import { CronExpressionParser } from "cron-parser";
import type { Project } from "./types";

export interface CronValidationResult {
  valid: boolean;
  normalized: string;
  nextRunAt: number | null;
  error?: string;
}

export function validateCronExpression(expression: string): CronValidationResult {
  const normalized = expression.trim();
  if (!normalized) {
    return {
      valid: false,
      normalized,
      nextRunAt: null,
      error: "请输入 Cron 表达式",
    };
  }

  try {
    const interval = CronExpressionParser.parse(normalized);
    return {
      valid: true,
      normalized,
      nextRunAt: interval.next().toDate().getTime(),
    };
  } catch (error) {
    return {
      valid: false,
      normalized,
      nextRunAt: null,
      error: error instanceof Error ? error.message : "Cron 表达式无效",
    };
  }
}

export function getNextCronRunAt(expression: string, currentDate = new Date()): number | null {
  try {
    return CronExpressionParser.parse(expression, { currentDate }).next().toDate().getTime();
  } catch {
    return null;
  }
}

export function getProjectsForAppLaunch(projects: Project[]): Project[] {
  return projects.filter((project) => project.startup_mode === "app-launch");
}

export function getProjectsForCron(projects: Project[]): Project[] {
  return projects.filter(
    (project) => project.startup_mode === "cron" && project.cron_expression.trim().length > 0
  );
}
