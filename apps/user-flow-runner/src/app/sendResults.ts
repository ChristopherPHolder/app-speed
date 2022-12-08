import {ApiGatewayManagementApiClient, PostToConnectionCommand} from '@aws-sdk/client-apigatewaymanagementapi';
import type {RunnerResponseMessage} from 'shared';
import {SUCCESSFUL_AUDIT_MSG} from "./constants";
import { Reports } from 'shared';

export async function sendAuditResults(connectionId: string, endpoint: string, resultsUrl: string,): Promise<void> {
	const reports: Reports = {htmlReportUrl: resultsUrl};
	const responseData: RunnerResponseMessage = {action: 'completed', message: SUCCESSFUL_AUDIT_MSG, reports: reports};

	const client = new ApiGatewayManagementApiClient({ region: 'us-east-1', endpoint: endpoint });
	// @ts-expect-error // Wrong typing in aws sdk
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const command = new PostToConnectionCommand({Data: JSON.stringify(responseData), ConnectionId: connectionId});
	await client.send(command);
}
