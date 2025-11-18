export type ActionStatus = "idle" | "success" | "error";

export interface ActionState<T = undefined> {
  status: ActionStatus;
  message?: string;
  data?: T;
}

export function initialActionState<T = undefined>(): ActionState<T> {
  return { status: "idle" };
}
