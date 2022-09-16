import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler  } from 'middy/middlewares'

import { getTodosForUser as getTodosForUser, parseLimitParameter,encodeNextKey, parseNextKeyParameter } from '../../businessLogic/todos'
import { getUserId } from '../utils';

import { createLogger } from '../../utils/logger'

const logger  = createLogger("getTodos");
// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    logger.info("## GET TODOS ##");
    let nextkey // Next key  to continue  scan operation  if necessary
    let limit // Maximum number or  elements to return 
    try {
      logger.info("## PARSE QUERY PARAMS ##")
      nextkey = await parseNextKeyParameter(event)
      limit = await parseLimitParameter(event) || 10
      logger.info("## GET USER ID ##",nextkey);
      const userId = getUserId(event)
      logger.info("## GET USER ID ##");
      const todos = await getTodosForUser(userId,limit,nextkey);
      logger.info("## TODOS By USER ID SUCCESSFULLY ##");

      return {
        statusCode: 200,
        body: JSON.stringify({
          "items": todos.items,
          "nextKey" : encodeNextKey(todos.nextKey)
        })
      };
    } catch (error) {
      logger.error('## GET TODO FAILED: ', { error: error.message })
      return {
        statusCode: 500,
        body: JSON.stringify({
          "message": "System errors"
        })
      }
    }
  })

handler
  .use(httpErrorHandler())
  .use(
  cors({
    credentials: true
  })
)
