/**
 * Activity logging helper — creates an activity log entry in PocketBase.
 * Fire-and-forget: never blocks the main operation.
 */
import { pbCreateActivityLog } from "./pocketbase";

export async function logActivity(data: {
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  details?: string;
}) {
  try {
    await pbCreateActivityLog({
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      entity_name: data.entity_name,
      details: data.details || "",
      created: new Date().toISOString(),
    });
  } catch {
    // Silent — activity logging should never break the main flow
  }
}
