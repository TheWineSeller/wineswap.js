export interface Asset {
  info: AssetInfo
  amount: string
}

export interface AssetInfosWithType {
  asset_infos: [AssetInfo, AssetInfo]
  pair_type: string
}

export type AssetInfo = NativeTokenInfo | NonNativeTokenInfo

export interface NativeTokenInfo {
  native_token: {
    denom: string
  }
}

export interface NonNativeTokenInfo {
  token: {
    contract_addr: string
  }
}