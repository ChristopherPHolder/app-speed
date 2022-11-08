import type {
	ApiGatewayManagementApiClientConfig,
	PostToConnectionCommandInput,
	PostToConnectionCommandOutput,
} from '@aws-sdk/client-apigatewaymanagementapi';
import {
	ApiGatewayManagementApiClient,
	PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import type {RunnerResponseMessage} from './types';

export async function sendAuditResults(
	connectionId: string,
	endpoint: string,
	resultsUrl: string,
): Promise<PostToConnectionCommandOutput> {

	const responseData: RunnerResponseMessage = {
		action: 'completed',
		message: 'Successfully completed the User Flow Audit',
		reports: {htmlReportUrl: resultsUrl},
	};

	const config: ApiGatewayManagementApiClientConfig = {region: 'us-east-1', endpoint: `https://${endpoint}`};
	const client = new ApiGatewayManagementApiClient(config);

	// @ts-expect-error // Wrong typing in aws sdk
	// eslint-disable-next-line @typescript-eslint/naming-convention
	const input: PostToConnectionCommandInput = {Data: responseData, ConnectionId: connectionId};
	const command = new PostToConnectionCommand(input);
	return client.send(command);
}
