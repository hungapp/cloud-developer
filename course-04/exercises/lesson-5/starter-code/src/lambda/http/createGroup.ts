import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { createGroup } from '../../businessLogic/groups'
import { CreateGroupRequest } from '../../requests/CreateGroupRequest'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('Processing event: ', event)

    const authorization = event.headers.Authorization
    const jwtToken = authorization.split(' ')[1]
    const newGroup: CreateGroupRequest = JSON.parse(event.body)

    const newItem = await createGroup(newGroup, jwtToken)

    return {
      statusCode: 201,
      body: JSON.stringify({
        newItem,
      }),
    }
  }
)

handler.use(
  cors({
    credentials: true,
  })
)
