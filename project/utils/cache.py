import datetime
import time
import threading

class TemplateTTLCache:
    """
    Template Time-To-Live (TTL) Cache, to be used for implementing
        * Ticker-Ticker cache
        * Ticker-Metrics cache
        * Ticker-Graphs cache

    The TTL parameter defines the end-of-life for an item inserted into the cache.
    This Template fixes it across all items, however adding a dynamic TTL policy is feasible
    """


    def __init__(self, ttlInSeconds: int, sweepInSeconds: int):
        """
        Initializes a cache with a custom TTL policy
        """
        self.data = {}
        self.TTL = datetime.timedelta(seconds=int(ttlInSeconds))
        self.sweepInterval = sweepInSeconds

        self.lock = threading.Lock()
        self._sweepThread = threading.Thread(target=self.sweepLoop, daemon=True)
        self._sweepThread.start()


    def _merge(self, d1: dict, d2: dict):
        """
        Helper function for combining dictionaries
        """
        for k, v in d2.items():
            d1[k] = v
        return d1


    def cached(self) -> list:
        """
        Queries the cache and returns all non-expired keys
        """

        NOW = datetime.datetime.now()
        return list(key for key, item in self.data.items() if item['expiry'] > NOW)


    def query(self, key):
        """
        Checks if a key is in the cache keys.
        If it is, the key's TTL is updated and the value returned
        Returns None if the key is not present in the cache
        """
        
        if key in self.cached():
            
            # reset the timer on cache hit
            NOW = datetime.datetime.now()
            self.data[key]['expiry'] = NOW + self.TTL
            return self.data[key]['data']
        else:
            return None


    def readItems(self, items: list) -> dict:
        """
        Optimized read for a group of items
        Misses are fetched + processed asynchronously and in parallel
        """
        
        # fetch and insert misses, return hits

        hits, misses = set(self.cached()) & set(items), set(items) - set(self.cached())
        
        # loads the data using a custom method
        missingData = None if misses == set() else self.loadData(list(misses)) 

        # assuming items 1-to-1 corresponds with misses
        if missingData is not None:
            for key, item in missingData.items():
                self.add(key, item)

        # return the union of the hit results and the miss results
        res = {hit: self.query(hit) for hit in hits} if missingData is None else self._merge({hit: self.query(hit) for hit in hits}, missingData)
        return res


    def loadData(self, misses: list) -> dict:
        """
        Overloaded function to be set during inheritance
        """
        raise Exception('Function loadData() must be overloaded by a child class')
        return {}


    def add(self, key, value) -> bool:
        """
        Inserts a key-value pair into the cache
        The key-value pair will be removed once the policy expires
        """

        # make an insertion and add a TTL policy
        NOW = datetime.datetime.now()
        self.data[key] = {'data': value, 'expiry': NOW + self.TTL}
        return True
    

    def sweepLoop(self):
        """
        Infinitely calls sweep in a thread on a delay
        """
        
        while True:
            time.sleep(self.sweepInterval)
            self.sweep()


    def sweep(self):
        """
        Iterates over cache items, popping any that are expired
        """

        NOW = datetime.datetime.now()
        toDelete = []

        # mark items for deletion in O(N)
        for key, item in self.data.items():
            if item['expiry'] < NOW:
                toDelete.append(key)

        # delete items in O(N)
        for key in toDelete:
            self.data.pop(key)


    def warmup(self, items: list[str], batchSize: int, delay: float):
        """
        Given keys, populates cache with k:v pairs while respecting
        batchSize and delay parameters
        """
        for i in range(batchSize, len(items), batchSize):
            i = min(len(items), i)

            tickerBatch = items[i - batchSize:i]
            res = self.readItems(tickerBatch)

            time.sleep(delay)

        
import yfinance as yf
from utils.scripts import graphDriverFunction as getGraphs, statWrapperFunction as getStats

class GraphCache(TemplateTTLCache):
    def __init__(self, ttlInterval, sweepInterval):
        super().__init__(ttlInterval, sweepInterval)


    def loadData(self, misses: list[str]) -> dict:
        """
        Fetches price histories via block call, then computes graph values with vectorized ops
        """

        data = yf.download(misses, period='10y', interval='1d', timeout=10)
        res = dict(getGraphs(data))

        # originally, data is keyed by graph type
        # we want it to be keyed by ticker name
        reformattedRes = {miss: {} for miss in misses}
        for graph, val in res.items():
            for ticker, stats in val.items():

                # remaps data without overwriting        
                reformattedRes[ticker][graph] = stats
                
        return reformattedRes

        

class StatsCache(TemplateTTLCache):
    def __init__(self, ttlInterval, sweepInterval):
        super().__init__(ttlInterval, sweepInterval)


    def loadData(self, misses: list[str]) -> dict:
        """
        Fetches stock stats from yfin efficiently with asyncio
        """
        
        return getStats(misses)
