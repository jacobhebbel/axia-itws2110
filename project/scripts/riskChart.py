import numpy as np
import datetime as dt

OPEN_PRICE, CLOSE_PRICE = 0, 1

def jsonToNumpyArrays(jsonOfEverything: dict):

    global OPEN_PRICE, CLOSE_PRICE

    aStock, aDateRange = jsonOfEverything.items()[0]
    numStocks, numDates = len(jsonOfEverything.keys()), len(aDateRange.keys())

    # mapping a thing to its index in the 3D array
    stockToIndex = {ticker: idx for ticker, idx in zip(jsonOfEverything.keys(), range(numStocks))}
    dateToIndex = {dt.datetime.fromisoformat(date): idx for date, idx in zip(aDateRange.keys(), range(numDates))}
    
    # empty initialization of np matrix
    historicalData = np.empty((numStocks, numDates, 2))
    
    for stock, stockIdx in stockToIndex.items():
        for date, dateIdx in dateToIndex.items():

            stockOpenPrice = float(jsonOfEverything[stock][date.isoformat()][OPEN_PRICE])
            stockClosePrice = float(jsonOfEverything[stock][date.isoformat()][CLOSE_PRICE])

            historicalData[stockIdx, dateIdx] = np.array([stockOpenPrice, stockClosePrice])

    return historicalData, stockToIndex, dateToIndex



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
    if useEqualWeights or len(tickerToCapital) == 0:
        return np.ones((portfolioSize))
    
    totalCapitalInvested = sum([capital for capital in tickerToCapital.values()])
    assetWeightVector = np.empty((len(tickerToCapital.keys())))
    
    for i, ticker, capitalInvested in enumerate(tickerToCapital.items()):
        assetWeightVector[i] = capitalInvested / totalCapitalInvested

    return assetWeightVector
    
def main():

    jsonInput = {} # start here
    tickerToCapital = {} # assume we have. if not, make this None and change useEqualWeights
    historicalData, stockToIndex, datetimeToIndex = jsonToNumpyArrays(jsonInput)
    
    weights = assetWeightVector(tickerToCapital, len(tickerToCapital.keys()), useEqualWeights=False)
    returnsVector = computeReturnsVector(tickerToOpenCloseVals)

if __name__ == '__main__':
    main()