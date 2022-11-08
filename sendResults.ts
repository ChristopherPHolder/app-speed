import type {PostToConnectionCommandOutput} from '@aws-sdk/client-apigatewaymanagementapi';
import {ApiGatewayManagementApiClient, PostToConnectionCommand} from '@aws-sdk/client-apigatewaymanagementapi';
import type {RunnerResponseMessage} from './types';
import {SUCCESSFUL_AUDIT_MSG} from "./constants";

export async function sendAuditResults(
	connectionId: string,
	endpoint: string,
	resultsUrl: string,
): Promise<PostToConnectionCommandOutput> {
	const reports = {htmlReportUrl: resultsUrl};
	const responseData: RunnerResponseMessage = {action: 'completed', message: SUCCESSFUL_AUDIT_MSG, reports: reports};

	const client = new ApiGatewayManagementApiClient({ region: 'us-east-1', endpoint: endpoint });
	// @ts-expect-error // Wrong typing in aws sdk
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const command = new PostToConnectionCommand({Data: responseData as Uint8Array, ConnectionId: connectionId});
	return client.send(command);
}
