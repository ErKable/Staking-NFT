module.exports = {
    // funzione per minare un blocco
    mineNBlocks: async function (n) {
        for (let index = 0; index < n; index++) {
            //await network.provider.send("evm_increaseTime", [500]); 
            await network.provider.send("evm_increaseTime", [3]);
            await ethers.provider.send('evm_mine');
        }
    },
    // invia token ad un utente
    feedUser: async function (token, user, amount) {
        let userz = await user.getAddress();
        await token.transfer(userz, amount);
    },
    // genera un signer da account seed
    generateAccount: function (n) {
        let account;
        account = ethers.provider.getSigner(n);
        return account;
    },
    // converti a unità token
    toTokenUnit: function (amount,decimals) {
        return ethers.utils.parseUnits(amount, decimals);
    },
    // converti a unità ETH
    toEthUnit: function (amount) {
        return Math.round(amount / 1e18);
    },
    // converti epoch in data
    getData: function (epoch) {
        return new Date(epoch *1000).toLocaleString();
    },
    // calcola il prezzo del gas in dollari
    getGasPriceUsd: function (tx_wait,is_matic) {
        let gasPrice;
        let bnbprice;
        let ethname;
        if(is_matic) {
            gasPrice = 0.000000012;
            bnbprice = 1.52;
            ethname = "MATIC"
        } else {
            gasPrice = 0.000000005;
            bnbprice = 390;
            ethname = "BNB"
        }
        ethUsed = parseInt(tx_wait.gasUsed) * gasPrice
       console.log((parseFloat(ethUsed) * bnbprice).toFixed(4),"$ - ",parseFloat(ethUsed).toFixed(4),ethname);
       return parseFloat((parseFloat(ethUsed) * bnbprice).toFixed(4))
    },
    getStakingApr: async function (token, staking_plat,single_token_price,value_of_rewards) {
        let staking_balance = await token.balanceOf(staking_plat.address);
        let value_staked = single_token_price * ethers.utils.formatUnits(staking_balance.toString(),"9");
        console.log(staking_balance.toString(),value_of_rewards.toString(),value_staked.toString());
        return "APR: " + ((value_of_rewards / value_staked) * 100).toFixed(2) + "%";
    },

    getEvents: async function (receipt) {
        for (const event of receipt.events) {
            if(event.event != undefined) {
                console.log(`Event ${event.event}\n-- ${event.args}\n--`);
            }
        }
    },
    getAmountsOut: async function (pancake_router, token_to_buy, path) {
        decimals = 9
        token_to_buy = ethers.utils.parseUnits(token_to_buy,decimals);
        let amounts_out = await pancake_router.getAmountsOut(token_to_buy, path);
        let eth_to_buy = amounts_out[1].toString();
        console.log("token to buy: ", token_to_buy);
        console.log("eth to buy: ", ethers.utils.formatEther(eth_to_buy));
        return eth_to_buy
    },

    buyToken: async function buyz(token, user, pancake_router, bnbToBuy, decimals){
        //console.log("cos? ", ethers.utils.parseUnits(token_to_buy,decimals))
        let WETH = await pancake_router.WETH()
        let path = [WETH, token.address];
        let to = await user.getAddress();
        let deadline = Date.now() + 60;
        const amounts_out = await pancake_router.getAmountsOut(bnbToBuy, path);
        //let bnb_to_buy = amounts_out[1].toString();
        console.log("bnb to buy: ",bnbToBuy);
        console.log("token suggested to buy: ", amounts_out);
        await pancake_router.connect(user).swapExactETHForTokensSupportingFeeOnTransferTokens(1, path, to, deadline, { value: bnbToBuy })
    },
    
    timeSleep: async function (timeToSleep) {
        await new Promise(r => setTimeout(r, timeToSleep * 1000));
    },
    sellToken: async function (pancake_router,user, token, _token_to_sell, decimals) {
        //let approve = await token.connect(user).approve(pancake_router.address, "100000000000000000000000000000000000000");
        let user_address = await user.getAddress()
        //await approve.wait();
        let WETH = await pancake_router.WETH()
        let path = [token.address,WETH];
        let balance
        if(_token_to_sell == 0) {
            balance = await token.balanceOf(user_address);
        } else {
            balance = ethers.utils.parseUnits(_token_to_sell,decimals)
        }
        //let tokenToSell = 1//ethers.utils.parseUnits("100000",decimals)
        //if(balance > tokenToSell) {
        //    balance = tokenToSell
        //}
        //const amounts_out = await pancake_router.getAmountsOut(balance, path);
        //let eth_to_receive = amounts_out[1].toString();
        //console.log("tokens to sell: ", ethers.utils.formatUnits(balance,decimals));
        //console.log("eth to receive: ", ethers.utils.formatEther(eth_to_receive));
        let deadline = Date.now() + 60;
        //let slippage = eth_to_receive / 2;
        let balance_init = await user.getBalance();
        path = [token.address, WETH];
        let tokenBalancep = await token.balanceOf(user_address)
        console.log("balance before sell: %s",ethers.utils.formatUnits(tokenBalancep,decimals))
        let tx = await pancake_router.connect(user).swapExactTokensForETHSupportingFeeOnTransferTokens(balance, 1, path, user_address, deadline);
        //tx = await pancake_router.connect(user).swapExactTokensForETHSupportingFeeOnTransferTokens(balance, 1, path, user_address, deadline);
        receipt = await tx.wait();
        //console.log("costo sell: "), this.getGasPriceUsd(receipt,false)
            // emits
        //console.log("eventi sell ",this.getEvents(receipt))
            
        let balance_after = await user.getBalance();
        console.log("eth gained: ", ethers.utils.formatEther(balance_after.sub(balance_init).toString()));
        let tokenBalanced = await token.balanceOf(user_address)
        console.log("balance dopo sell: %s",ethers.utils.formatUnits(tokenBalanced,decimals))
    },
    addLiquidity: async function(pancake_router,user, token, token_to_add,eth_to_add, decimals) {
        let to = await user.getAddress();
        
        let amountTokenDesired = ethers.utils.parseUnits(token_to_add,decimals);
        let amountTokenMin = 1//ethers.utils.parseUnits(token_to_add,decimals);
        let amountETHMin = ethers.utils.parseEther(eth_to_add);
        let deadline = Date.now() + 60;
        let approve = await token.connect(user).approve(pancake_router.address, "10000000000000000000000000000000000000");
        await approve.wait();
        console.log("add liq %s - %s token : %s ETH",to,amountTokenDesired,amountETHMin)
        const add_liq = await pancake_router.connect(user).addLiquidityETH(token.address, amountTokenDesired, amountTokenMin, amountETHMin, to, deadline, { value: amountETHMin });
        return add_liq
    },
    removeALLLiquidity: async function(pancake_router,user, token, _pair, balanceLpUser) {
        //console.log("param arrivati:", pancake_router.address, await user.getAddress(), token.address, _pair.address )
        let testWbnb = await hre.ethers.getContractAt("PancakePair", "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"); //just per print e l approve che nso manco se serve
        let userAddrs = user.getAddress();

        let returnReserve = await _pair.connect(user).getReserves();
        let tkn0 = await _pair.connect(user).token0();
        let tkn1 = await _pair.connect(user).token1();
        let reserve0 = returnReserve[0].toString()
        let reserve1 = returnReserve[1].toString()
        //let balanceLpUser =  await _pair.connect(user).balanceOf(await userAddrs) //porcodio torna 0 non ha senso, stessa cosa dilla torna giusto .-.
        //console.log(`(${_pair.address}) pair.balanceOf(${await userAddrs}) = ${balanceLpUser}    [su testutils]`)

    console.log(` pair -- 
            - tokBlance ${(await token.balanceOf(_pair.address)).toString()} 
            - wbnb: ${(await testWbnb.balanceOf(_pair.address)).toString()} 
            - User LP balance: ${balanceLpUser.toString()} `)
        
        let deadline =  Date.now() + 60;

      //ma sssi approviamo anche gesu
      let approve = await _pair.connect(user).approve(pancake_router.address, "10000000000000000000000000000000000000");
      let approves = await _pair.connect(user).approve(_pair.address, "10000000000000000000000000000000000000");
      let approvez = await token.connect(user).approve(pancake_router.address, "10000000000000000000000000000000000000");
      let approvezz = await token.connect(user).approve(_pair.address, "10000000000000000000000000000000000000");
      let ancorapiuapprove = await testWbnb.connect(user).approve(pancake_router.address, "10000000000000000000000000000000000000");
      let ancorapiuapprovez = await testWbnb.connect(user).approve(_pair.address, "10000000000000000000000000000000000000");
      await approve.wait();
      await ancorapiuapprove.wait()
      await ancorapiuapprovez.wait()
      await approves.wait()
      await approvez.wait();
      await approvezz.wait();

        console.log("reserve 0 e 1 ", reserve0, reserve1)
        let rem_liq = await pancake_router.connect(user).removeLiquidity(tkn0,tkn1, balanceLpUser, 1, 1, await userAddrs, deadline); 
        
        return rem_liq;
    }
}


//100000000000000000
//70000000000000000
//700000000000000