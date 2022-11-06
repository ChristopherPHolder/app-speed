import {
    ApiGatewayManagementApiClient,
    ApiGatewayManagementApiClientConfig,
    PostToConnectionCommand, PostToConnectionCommandInput, PostToConnectionCommandOutput
} from "@aws-sdk/client-apigatewaymanagementapi";

export async function sendAuditResults(connectionId: string, endpoint: string): Promise<PostToConnectionCommandOutput> {
    const config:  ApiGatewayManagementApiClientConfig = {
        region: 'us-east-1',
        endpoint: `https://${endpoint}`,
    }
    const client = new ApiGatewayManagementApiClient(config);
    const input: PostToConnectionCommandInput = {
        //@ts-ignore // Wrong typing in sdk
        Data: 'Testing message',
        ConnectionId: connectionId
    }
    const command = new PostToConnectionCommand(input);
    const response = await client.send(command);
    console.log(response);
    return response;
}