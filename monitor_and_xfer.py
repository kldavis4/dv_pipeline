from multiprocessing import Pool, Queue, TimeoutError
import time
import os
import subprocess
import sys

import utils

items_to_process = {}
queue = Queue()
rootPath = os.path.abspath('/Users/kldavis/Movies/iMovie Events.localized')
destRootPath = '/Users/kelly/Movies/dvimports'
destHost = 'kelly@macbookpro2016.local'

def collect_fn(fpath):
  print('adding', fpath, 'to queue')

  queue.put(fpath)
  items_to_process[fpath] = utils.STATUS_INPROGRESS

def worker_main(queue):
  while True:
    item = queue.get(True)
    if item is None:
      time.sleep(1)

    print('processing', item)
    dest_file_path = f'{destRootPath}/{item[len(rootPath) + 1:]}'.replace(' ', '_').replace(';', '-')
    dest_dir = os.path.dirname(dest_file_path)

    status = 'UNKOWN'
    error = None
    try:
      result = subprocess.run(['ssh', destHost, f'mkdir -p {dest_dir}'], check=True)
      result = subprocess.run(['scp', item, f'{destHost}:{dest_file_path}'], check=True)
      status = 'DONE'
    except Exception as err:
      status = 'FAIL'
      error = err

    print('done processing', item, 'status', status)

    # create the done marker file
    with open(f'{item}.{status}', 'w') as fp:
      if status == 'FAIL':
        fp.write(str(error))

    time.sleep(1) # simulate a "long" operation

if __name__ == '__main__':
  # scan folder for items to process
  # add items to todo list

  pool = Pool(2, worker_main, (queue,))

  while True:
    utils.collect_candidates(rootPath, items_to_process, collect_fn)

    time.sleep(1)
