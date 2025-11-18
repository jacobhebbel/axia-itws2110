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
        self._sweepThread = threading.Thread(target=self.sweep(), daemon=True)
        self._sweepThread.start()


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
            
            return self.data.get(key, None)
        
        else:
            return None


    def readItems(self, items: list) -> dict:
        """
        Optimized read for a group of items
        Misses are fetched + processed asynchronously and in parallel
        """
        
        # fetch and insert misses, return hits
        hits, misses = set(self.cached()) ^ set(items), set(items) - set(self.cached())
        
        # loads the data using a custom method
        data = self.loadData(list(misses))

        # assuming items 1-to-1 corresponds with misses
        # this adds all of the misses into the cache
        for key, item in data.items():
            self.add(key, item)

        # return the union of the hit results and the miss results
        res = {hit: self.query(hit) for hit in hits} | {key: item for key, item in zip(misses, items)}
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


import yfinance as yf
from utils.scripts import graphDriverFunction as getGraphs, statDriverFunction as getStats

class GraphCache(TemplateTTLCache):
    def __init__(self, ttlInterval, sweepInterval):
        super().__init__(ttlInterval, sweepInterval)


    def loadData(self, misses) -> dict:
        """
        Fetches price histories via block call, then computes graph values with multiprocessing
        """
        data = yf.download(misses, period='10y', interval='1d', timeout=10)
        res = getGraphs(data)
        return res
        

class StatsCache(TemplateTTLCache):
    def __init__(self, ttlInterval, sweepInterval):
        super().__init__(ttlInterval, sweepInterval)


    def loadData(self, misses) -> dict:
        """
        Fetches stock stats from yfin efficiently with asyncio
        """
        
        data = getStats()
        
        
        pass
        return {}

