export type WorkflowEventType =
	| "transaction:created"
	| "transaction:updated"
	| "transaction:deleted";

export type WorkflowEvent = {
	id: string;
	type: WorkflowEventType;
	organizationId: string;
	data: Record<string, unknown>;
	timestamp: string;
};
