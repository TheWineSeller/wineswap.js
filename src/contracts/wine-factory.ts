import { AccAddress, MsgExecuteContract, MsgInstantiateContract } from '@terra-money/terra.js'
import { Contract } from './contract'
import { AssetInfo, AssetInfosWithType } from '../types'

interface InitMsg {
  owner: AccAddress,
  pair_code_id: number,
  token_code_id: number,
}

// query msg and responses
interface ConfigResponse {
  owner: AccAddress,
  pair_code_id: number,
  token_code_id: number,
}

interface PairQuery {
  asset_infos: [AssetInfo, AssetInfo],
  pair_type?: string
}

interface PairsQuery {
  start_after?: AssetInfosWithType,
  limit?: number
}

interface PairResponse {
  pairs: {
    asset_infos: [AssetInfo, AssetInfo]
    contract_addr: AccAddress,
    liqudity_token: AccAddress,
    pair_type: string
  }[]
}

interface PairTypeQuery {
  type_name: String
}

interface PairTypesQuery {
  start_after?: string,
  limit?: number
}

interface PairTypeResponse {
  type_name: string
  // tick price = 1.0001 ^ (tick_index * tick_sapce)
  tick_space: number
  fee_rate: string
}

// execute msgs

interface UpdateConfigExecute {
  owner?: string,
  token_code_id?: number,
  pair_code_id?: number,
}


interface CreatePairExecute {
  asset_infos: [AssetInfo, AssetInfo],
  pair_type: string,
  initial_price: string,
}

interface AddPairTypeExecute {
  type_name: string,
  tick_space: number,
  fee_rate: string
}

export class WineFactory extends Contract{
  // requirement: protocol_fee_rate <= 1
  public init(init_msg: InitMsg): MsgInstantiateContract {
    return this.createInstantiateMsg(init_msg, {});
  }

  // update config
  // requirement: msg_sender == owner
  public updateConfig(update_config: UpdateConfigExecute): MsgExecuteContract {
    return this.createExecuteMsg({ update_config })
  }

  // create pair
  // requirement: if both asset is not uusd(UST) then both asset have at least one asset-ust pair for each
  // also can't make the pair with already exist (assets, pairtype)
  public createPair(asset_infos: [AssetInfo, AssetInfo], pair_type: string, initial_price: number): MsgExecuteContract {
    const create_pair: CreatePairExecute = {
      asset_infos,
      pair_type,
      initial_price: initial_price.toFixed(10)
    }
    return this.createExecuteMsg({ create_pair })
  }

  // add pair type
  // requirement: msg_sender == owner
  public addPairType(type_name: string, tick_space: number, fee_rate: number): MsgExecuteContract {
    const add_pair_type: AddPairTypeExecute = {
      type_name,
      tick_space,
      fee_rate: fee_rate.toFixed(10)
    }
    return this.createExecuteMsg({ add_pair_type })
  }

  // QueryMsg
  public configQuery(): Promise<ConfigResponse> {
    return this.query({ config: {} })
  }

  public pairQuery(asset_infos: [AssetInfo, AssetInfo], pair_type?: string): Promise<PairResponse> {
    const pair: PairQuery = { asset_infos, pair_type }
    return this.query({ pair })
  }

  public pairsQuery(pairs: PairsQuery): Promise<PairResponse> {
    return this.query({ pairs })
  }

  public pairTypeQuery(type_name: string): Promise<PairTypeResponse> {
    const pair_type: PairTypeQuery = {type_name}
    return this.query({ pair_type })
  }

  public pairTypesQuery(pair_types: PairTypesQuery): Promise<PairTypeResponse[]> {
    return this.query({ pair_types })
  }
}
