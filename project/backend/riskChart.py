import numpy as np

def computeReturnsVector(prices):
    
    returnsVector = np.empty((len(prices.keys())))

    for stock in prices.keys():
        historicalData = prices[stock]

        for i in range(1, len(historicalData.keys())):
            returnsVector[i] = 
    pass

def marginalContributionToRisk():
    pass

def contributionToTotalRisk():
    pass

def portfolioVolatility():
    pass

def assetWeightVector(tickerToCapital: dict, portfolioSize: int, useEqualWeights: bool, ):
    if useEqualWeights:
        return np.ones((portfolioSize))
    
    totalCapitalInvested = sum([capital for capital in tickerToCapital.values()])
    assetWeightVector = np.empty((len(tickerToCapital.keys())))
    
    for i, ticker, capitalInvested in enumerate(tickerToCapital.items()):
        assetWeightVector[i] = capitalInvested / totalCapitalInvested

    return assetWeightVector
    
def main():

    tickerToCapital = {}                    # assume key => int
    tickerToOpenCloseVals = {}              # assume key => [dates] => {open: int, close: int}
    weights = assetWeightVector(tickerToCapital, len(tickerToCapital.keys()), useEqualWeights=False,)
    returnsVector = computeReturnsVector(tickerToOpenCloseVals)

if __name__ == '__main__':
    main()