import { Coin, Coins, MsgExecuteContract, MsgInstantiateContract } from '@terra-money/terra.js'
import { Contract } from './contract'
import { Asset, AssetInfo, NativeTokenInfo, NonNativeTokenInfo } from '../types'

interface InitMsg {
  asset_infos: [AssetInfo, AssetInfo]
  token_code_id: number
  initial_price: string
  tick_space: number
  fee_rate: string
}

// query msg and responses
interface PairInfoResponse {
  liquidity_token: string
  asset_infos: [AssetInfo, AssetInfo]
  tick_space: number
  fee_rate: string
  price: string
  current_tick_index: number
}
interface TickInfoQuery {
  tick_index: number
}

interface TickInfosQuery {
  start_after?: number
  lmit?: number
}

interface TickInfoResponse {
  tick_index: number
  tick_info: {
    last_fee_growth_0: string
    last_fee_growth_1: string
    total_liquidity: string
  }
}

interface ProvideCalculationQuery {
  asset: Asset,
  upper_tick_index: number
  lower_tick_index: number
}

interface ProvideCalculationResponse {
  asset: Asset
}

interface WithdrawCalculationResponse {
  assets: [Asset, Asset]
}

interface SimulationQuery {
  offer_asset: Asset
}

interface SimulationResponse {
  return_amount: string
  commission_amount: string
}

interface ReverseSimulationQuery {
  ask_asset: Asset
}

interface ReverseSimulationResponse {
  offer_amount: string,
  commission_amount: string
}

// execute msgs
interface ProvideLiquidityExecute {
  assets: [Asset, Asset]
  // if you want to add more liquidity to exist liqiuidity token, then use token_id
  // if you want new position use tick_indexes
  token_id?: string
  // price range: tick_price(lower_tick_index * tick_space) ~ tick_price((upper_tick_index + 1) * tick_space)
  // tick_price(tick): 1.0001 ^ tick
  tick_indexes?: {
    upper_tick_index: number
    lower_tick_index: number
  }
}

interface WithdrawLiquidityExecute {
  token_id: string
  // if amount is not given withdraw all and burn liquidity
  amount?: string 
}

interface SwapExecute {
  offer_asset: Asset
  to?: string
  belief_price?: string
  max_slippage?: string
}

interface ClaimRewardExecute {
  token_id: string
  rewards: [Asset, Asset],
  effective_liquidity_diff: string
}

export class WinePair extends Contract{
  public init(init_msg: InitMsg): MsgInstantiateContract {
    return this.createInstantiateMsg(init_msg, {});
  }

  // provide liquidity
  // requirement: upper_tick_index > lower_tick_index, liquidity > 0, upper_tick_index - lower_tick_index <= 500
  public provideLiquidity(provide_liquidity: ProvideLiquidityExecute): MsgExecuteContract {
    let coins: Coins = new Coins([]);
    provide_liquidity.assets.map((asset) => {
      if (isNative(asset)) {
        const info = asset.info as NativeTokenInfo
        coins = coins.add(new Coin(info.native_token.denom, asset.amount))
      }
    })

    return this.createExecuteMsg({ provide_liquidity }, coins)
  }

  // withdraw liquidity
  // requirement: msg_sender == liquidity_owner
  public withdrawLiquidity(token_id: string, amount?: string): MsgExecuteContract {
    const withdraw_liquidity: WithdrawLiquidityExecute = { token_id, amount }
    return this.createExecuteMsg({ withdraw_liquidity })
  }

  // swap 
  public swap(offer_asset: Asset, params?: {to?: string, belief_price?: number, max_slippage?: number}): MsgExecuteContract {
    if (!params) {
      params = {}
    }
    if (isNative(offer_asset)) {
      const info = offer_asset.info as NativeTokenInfo
      const swap: SwapExecute = {
        offer_asset,
        to: params?.to,
        belief_price: params?.belief_price ? params?.belief_price.toFixed(10) : undefined,
        max_slippage: params?.max_slippage ? params?.max_slippage.toFixed(10) : undefined
      }
      return this.createExecuteMsg({ swap }, new Coins(swap.offer_asset.amount + info.native_token.denom))
    } else {
      const info = offer_asset.info as NonNativeTokenInfo
      const to = params.to ? `"to": "${params.to}",` : ''
      const belief_price = params.belief_price? `"belief_price": "${params.belief_price}",` : ''
      const max_slippage = params.max_slippage? `"max_slippage": "${params.max_slippage}",` : ''
      let swapOptions = (to + belief_price + max_slippage)
      const msg = {
        send: {
          amount: offer_asset.amount,
          contract: this.contractAddress,
          msg: stringToBase64(`{
            "swap": {
              ${swapOptions.slice(0, swapOptions.length - 1)}
            }
          }`)
        }
      }
      return new MsgExecuteContract(
        this.key.accAddress,
        info.token.contract_addr,
        msg
      )
    }
  }

  // claim reward
  // requirement: msg_sender == liquidity_token
  public claimReward(claim_reward: ClaimRewardExecute): MsgExecuteContract {
    return this.createExecuteMsg({ claim_reward })
  }

  // QueryMsg
  public pairInfoQuery(): Promise<PairInfoResponse> {
    return this.query({ config: {} })
  }

  public tickInfoQuery(tick_index: number): Promise<TickInfoResponse> {
    const tick_info: TickInfoQuery = { tick_index }
    return this.query({ tick_info })
  }

  public tickInfosQuery(tick_infos: TickInfosQuery): Promise<TickInfoResponse[]> {
    return this.query({ tick_infos })
  }

  public provideCalculationQuery(asset: Asset, upper_tick_index: number, lower_tick_index: number): Promise<ProvideCalculationResponse> {
    const provide_calculation: ProvideCalculationQuery = { asset, upper_tick_index, lower_tick_index }
    return this.query({ provide_calculation })
  }

  public withdrawCalculationQuery(token_id: string): Promise<WithdrawCalculationResponse> {
    const withdraw_calculation = { token_id }
    return this.query({ withdraw_calculation })
  }

  public simulationQuery(offer_asset: Asset): Promise<SimulationResponse> {
    const simulation: SimulationQuery = { offer_asset }
    return this.query({ simulation })
  }

  public reverseSimulationQuery(ask_asset: Asset): Promise<ReverseSimulationResponse> {
    const reverse_simulation: ReverseSimulationQuery = { ask_asset }
    return this.query({ reverse_simulation })
  }

  public cumulativeVolumeQuery(): Promise<[string, string]> {
    return this.query({ cumulative_volume: {} })
  }
}


function isNative(asset: Asset): boolean {
  const info = asset.info as any
  if (info.native_token) {
    return true
  } else {
    return false
  }
}

function stringToBase64(input: string): string {
  const stringified = JSON.stringify(JSON.parse(input))
  return Buffer.from(stringified).toString('base64')
}