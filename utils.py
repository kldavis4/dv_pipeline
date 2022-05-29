import os
import psutil
import sys

STATUS_NEW = 1
STATUS_INPROGRESS = 2
STATUS_DONE = 3

def has_handle(fpaths):
  result = {}
  if len(fpaths) > 0:
    for proc in psutil.process_iter():
      try:
        for item in proc.open_files():
          for fpath in fpaths:
            if fpath == item.path:
              result[fpath] = 1
      except Exception:
        pass

  return result

def collect_candidates(directory, in_progress, collect_fn):
  for root, subdirectories, files in os.walk(directory):
      dir_candidates = {}
      done_items = {}
      fail_items = {}
      for file in [os.path.abspath(f'{root}/{f}') for f in files if f.endswith('.DONE')]:
        done_items[file] = 1
      for file in [os.path.abspath(f'{root}/{f}') for f in files if f.endswith('.FAIL')]:
        fail_items[file] = 1

      dv_files = [os.path.abspath(f'{root}/{f}') for f in files if f.endswith('.dv')]
      open_dv_files = has_handle(dv_files)
      for file in dv_files:
        if done_items.get(f'{file}.DONE'):
          in_progress[file] = STATUS_DONE
        elif done_items.get(f'{file}.FAIL'):
          in_progress[file] = STATUS_NEW
          collect_fn(file)
        else:
          if not in_progress.get(file):
            if not open_dv_files.get(file):
              in_progress[file] = STATUS_NEW
              collect_fn(file)
