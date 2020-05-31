import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'

const cert = `-----BEGIN CERTIFICATE-----
MIIDBTCCAe2gAwIBAgIJedRM4TrYzbbQMA0GCSqGSIb3DQEBCwUAMCAxHjAcBgNV
BAMTFWh1bmdhcHAtZGV2LmF1dGgwLmNvbTAeFw0yMDA1MjgyMjAzMDdaFw0zNDAy
MDQyMjAzMDdaMCAxHjAcBgNVBAMTFWh1bmdhcHAtZGV2LmF1dGgwLmNvbTCCASIw
DQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAOirdwekJT2F30S5cc/AsEL92ta2
01zt50wSpOi26KFFLtStQId6+WUIaQJ81Gno8RXrwlVVnuCW8/WBc8yhAfRBpqE/
6/bOhBvPO8kmon0/oTfj5eqPTgqSEK3AaWGkKtA4pRXa1KYFNkOzMId5MqbUcwW9
H3lUfYkpJuV6DoN3XfUZGVm/hQIJgyL30AunNYXmEcQy/uspv4G3kD2bwIm9Kmpm
W/MwdUoiXzwqUtG2oZsLegy2zxh/9rUxvn5tgcxQ1L4PDmVCSQ+T6fY0phWde7Y1
M/n0e1UEShABuBao4Q3p3XvWOTIhENOPEqBKsqRF1qeRORMZbrw2cC58vXUCAwEA
AaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUvMd9rcmELN/Lpksrvi7J
y+a4/nowDgYDVR0PAQH/BAQDAgKEMA0GCSqGSIb3DQEBCwUAA4IBAQDZD53Y0TnT
0+orxjd4JvQGIfkF/kP498uKGW9ATEUYsXmbnUefVlY9rJbDtyeV6tpq+rATFL0U
w3PsiTXY6Els1CSkmX14Xc8TCaJJFOFcFu4pdIxMP802dLZpH3RvZ0tlY+cXlfQ4
94ScwLbUT/WnR9gmllt0e2usaY3WGQdX8KnqioRCRMDrEyzjsPqIiFArCRl41yO8
L7+YbbpSTZBhtf0cTNOmlp0pqFeRDTzfgwtVCKr0fm6WyGrNTyXkTwOYzlXKkR8c
iJm556O55Q+D4unGmv1EKQG2HXDkGQzRossw7U5G72RFFCR+wQTbMQ8iwuC9r6X5
ct8hiTsDHVpb
-----END CERTIFICATE-----`
export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  try {
    const decodedToken: JwtToken = verifyToken(event.authorizationToken, cert)
    console.log('User was authorized', decodedToken)

    return {
      principalId: decodedToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*',
          },
        ],
      },
    }
  } catch (e) {
    console.log('User was not authorized', e.message)

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*',
          },
        ],
      },
    }
  }
}

function verifyToken(authHeader: string, cert: string): JwtToken {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return verify(token, cert, {
    algorithms: ['RS256'],
  }) as JwtToken
}
