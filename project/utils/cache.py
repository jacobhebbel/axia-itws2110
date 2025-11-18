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


    def __init__(self, ttlInSeconds, sweepInSeconds):
        """
        Initializes a cache with a custom TTL policy
        """
        self.data = {}
        self.TTL = datetime.timedelta(seconds=int(ttlInSeconds))
        self.sweepInterval = sweepInSeconds

        self.lock = threading.Lock()
        self._sweepThread = threading.Thread(target=self.sweep(), daemon=True)
        self._sweepThread.start()


    def query(self, key):
        """
        Checks if a key is in the cache keys.
        If it is, the key's TTL is updated and the value returned
        Returns None if the key is not present in the cache
        """
        
        if key in self.data.keys():
            
            # reset the timer on cache hit
            NOW = datetime.datetime.now()
            self.data[key]['expiry'] = NOW + self.TTL
            
            return self.data.get(key, None)
        
        else:
            return None

    

    def add(self, key, value):
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



