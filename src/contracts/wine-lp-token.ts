import { AccAddress, MsgExecuteContract, MsgInstantiateContract } from '@terra-money/terra.js'
import { Contract } from './contract'
import { Expiration } from '../types'
import { trimMsg } from '../utils/trimType';

interface InitMsg {
  name: string,
  symbol: string,
  minter: AccAddress
}

// query msg and responses
interface OwnerOfQuery {
  token_id: string
}

interface OwnerOfResponse {
  owner: string
}

interface ConfigResponse {
  name: string
  symbol: string,
  minter: AccAddress
}

interface LiquidityInfoQuery {
  token_id: string
}

interface LiquidityInfoResponse {
  owner: AccAddress,
  approvals:{
    spender: string
    expires: Expiration
  }[],
  liquidity: string,
  upper_tick_index: number,
  lower_tick_index: number,
}

interface TokensQuery {
  owner: AccAddress,
  start_after?: string,
  limit?: number 
}

interface AllTokensQuery {
  start_after?: string,
  limit?: number 
}

interface TokensResponse {
  tokens: string[]
}

interface MinterResponse {
  minter: string
}

interface RewardQuery {
  token_id: string
}

interface RewardResponse {
  rewards: [number, number]
}

// execute msgs

interface TransferExecute {
  recipient: string,
  token_id: string
}

interface ApproveExecute {
  spender: string,
  token_id: string,
  expires?: Expiration
}

interface RevokeExecute {
  spender: string, token_id: string
}

interface BurnExecute {
  token_id: string
}

interface MintExecute {
  owner: string,
  liquidity: string,
  upper_tick_index: number,
  lower_tick_index: number
}

interface ClaimReward {
  token_id: string,
}

interface UpdateLiquidityExecute {
  token_id: string,
  amount: string,
  add: boolean,
}

export class WineLpToken extends Contract{
  public init(init_msg: InitMsg): MsgInstantiateContract {
    return this.createInstantiateMsg(init_msg, {});
  }

  // execute msg

  // mint liquidity
  // requirement: msg_sender == minter
  public mint(mint: MintExecute): MsgExecuteContract {
    return this.createExecuteMsg({ mint })
  }

  // burn liquidity
  // requirement: msg_sender == minter
  public burn(burn: BurnExecute): MsgExecuteContract {
    return this.createExecuteMsg({ burn })
  }

  // transfer liquidity to other
  // requirement: msg_sender == owner or msg_sender == spender
  public transfer(recipient: string, token_id: string): MsgExecuteContract {
    const transfer: TransferExecute = {
      recipient,
      token_id
    }
    return this.createExecuteMsg({ transfer })
  }

  // send liquidity to contract and execute something with msg
  // requirement: msg_sender == owner or msg_sender == spender
  public send(contract: string, token_id: string, msg: JSON): MsgExecuteContract {
    const modifiedMsg = {
      send: {
        contract,
        token_id,
        msg: trimMsg(msg)
      }
    }
    return this.createExecuteMsg(modifiedMsg)
  }

  // allows operator to transfer / send the token from the owner's account.
  public approve(spender: string, token_id: string, expires?: Expiration): MsgExecuteContract {
    const approve: ApproveExecute = {
      spender,
      token_id,
      expires
    }
    return this.createExecuteMsg({ approve })
  }

  // Remove previously granted Approval
  public revoke(spender: string, token_id: string): MsgExecuteContract {
    const revoke: RevokeExecute = { spender, token_id }
    return this.createExecuteMsg({ revoke })
  }

  // claim reward
  // requirement: msg_sender == owner or msg_sender == pair
  public claimReward(token_id: string): MsgExecuteContract {
    const claim_reward: ClaimReward = { token_id }
    return this.createExecuteMsg({ claim_reward })
  }

  // modify liquidity
  // requirement: msg_sender == minter(pair)
  public udpateLiquidity(update_liquidity: UpdateLiquidityExecute): MsgExecuteContract {
    return this.createExecuteMsg({ update_liquidity })
  }



  // QueryMsg
  public ownerOfQuery(token_id: string): Promise<OwnerOfResponse> {
    const owner_of: OwnerOfQuery = { token_id }
    return this.query({ owner_of })
  }

  public configQuery(): Promise<ConfigResponse> {
    return this.query({ config:{} })
  }

  public liquidityInfoQuery(token_id: string): Promise<LiquidityInfoResponse> {
    const liquidity_info: LiquidityInfoQuery= { token_id }
    return this.query({ liquidity_info })
  }

  public tokensQuery( owner: string, params?: { start_after?: string, limit?: number } ): Promise<TokensResponse> {
    if (!params) {
      params = {}
    }
    const tokens: TokensQuery = {
      owner,
      start_after: params?.start_after,
      limit: params?.limit
    }
    return this.query({ tokens })
  }

  public allTokensQuery( all_tokens: AllTokensQuery ): Promise<TokensResponse> {
    return this.query({ all_tokens })
  }

  public minterQuery(): Promise<MinterResponse> {
    return this.query({ minter: {} })
  }

  public rewardQuery(token_id: string): Promise<RewardResponse> {
    const reward: RewardQuery = {token_id}
    return this.query(reward)
  }
}
