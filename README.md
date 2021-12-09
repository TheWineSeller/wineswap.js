# wineswap.js

## Usage
1. build wine.js
```sh
$npm install
$npm run build
```
2. install it on your another project
```sh
$npm install ../wine.js
```
../wine.js is just example, put the right path
## sample

* Swap
```ts
import { WinePair } from 'wineswap.js'
import { LCDClient, MnemonicKey, Wallet } from '@terra-money/terra.js'

function sample() {
  const wineToken = 'terra1ud90r7y6k57pedm47ucm8umyjj6w8umpsjfvjk'
  const mnemonic = ''
  const key = new MnemonicKey({ mnemonic })
  const lcd = new LCDClient({
    URL: 'https://bombay-lcd.terra.dev',
    chainID: 'bombay-12',
    gasPrices: '0.15uusd',
    gasAdjustment: '1.4'
  })

  const wallet = new Wallet(lcd, key)

  const wineUstPair = new WinePair({
    contractAddress: 'terra1ahm3pn7fv9rnpwmcfkxerurde3luffrq83uyxw',
    lcd,
    key
  })

  const offer_asset = {
    info: {
      token: {
        contract_addr: wineToken
      }
    },
    amount: '1000000'
  }

  const swapMsg0 = wineUstPair.swap(offer_asset)

  wallet.createAndSignTx({msgs: [swapMsg0]}).then((tx) => {
    lcd.tx.broadcastAsync(tx)
  })
}
```

* provide
```ts
import { WinePair } from 'wineswap.js'
import { LCDClient, MnemonicKey, Wallet, MsgExecuteContract } from '@terra-money/terra.js'

function sample() {
  const wineToken = 'terra1ud90r7y6k57pedm47ucm8umyjj6w8umpsjfvjk'
  const mnemonic = ''
  const key = new MnemonicKey({ mnemonic })
  const lcd = new LCDClient({
    URL: 'https://bombay-lcd.terra.dev',
    chainID: 'bombay-12',
    gasPrices: '0.15uusd',
    gasAdjustment: '1.4'
  })

  const wallet = new Wallet(lcd, key)

  const wineUstPair = new WinePair({
    contractAddress: 'terra1ahm3pn7fv9rnpwmcfkxerurde3luffrq83uyxw',
    lcd,
    key
  })

  const asset0 = {
    info: {
      token: {
        contract_addr: wineToken
      }
    },
    amount: '1000000'
  }

  const upper_tick_index = 10
  const lower_tick_index = -7

  wineUstPair.provideCalculationQuery(asset0, upper_tick_index, lower_tick_index)
  .then((res) => {
    const asset1 = res.asset
    const increaseAllowanceMsg = new MsgExecuteContract(key.accAddress, wineToken, {
      increase_allowance: {
        amount: '1000000',
        spender: wineUstPair.contractAddress
      }
    })

    const provide_liquidity = {
      assets: [asset0, asset1],
      tick_indexes: {
        upper_tick_index,
        lower_tick_index
      }
    }
    
    const provideMsg = wineUstPair.provideLiquidity(provide_liquidity)
    return [increaseAllowanceMsg, provideMsg]
  })
  .then((msgs)=> {
    wallet.createAndSignTx({ msgs }).then((tx) => {
      lcd.tx.broadcastAsync(tx)
    })
  })
}
```
