SHELL := /bin/bash
# SRC_DIR=.
# SRC_FILES = $(shell find . -type f -name '*.dv')

# DEST_FILES = $(patsubst $(SRC_DIR)/%.dv,$(SRC_DIR)/%.mp4,$(SRC_FILES))
# DEST_FILES2 = $(patsubst $(SRC_DIR)/%.jpeg,$(SRC_DIR)/%.eps,$(SRC_FILES2))

# FLAC_FILES = $(shell find . -printf "\"%p\" " -type f -name '*.dv')
DVIMPORTS=/Users/kelly/Movies/dvimports
FLAC_FILES = $(shell find $(DVIMPORTS) -type f -name '*.dv')
MP3_FILES = $(patsubst %.dv,%.mp4,$(FLAC_FILES))
S3_FILES = $(patsubst %.dv,%.s3,$(FLAC_FILES))
MP4_FILES = $(shell find $(DVIMPORTS) -type f -name '*.mp4')
YT_FILES = $(patsubst %.mp4,%.yt.json,$(MP4_FILES))
S3_BUCKET=dvimports

IMPORT_FOLDERS=$(shell find $(DVIMPORTS)/* -type d)
CONCAT_MP4S=$(patsubst %,%-yt.mp4,$(IMPORT_FOLDERS))
CONCAT_MP4_DESCRIPTIONS=$(patsubst %,%-yt.txt,$(IMPORT_FOLDERS))
FINISHED_CONCAT_MP4S=$(shell find $(DVIMPORTS) -type f -name '*-yt.mp4')
CONCAT_MP4_UPLOADS=$(patsubst %-yt.mp4,%-yt.json,$(FINISHED_CONCAT_MP4S))

DROPBOX_FOLDERS=$(patsubst %,%-dropbox,$(IMPORT_FOLDERS))

CHROME_WS=ws://127.0.0.1:9222/devtools/browser/a884c78a-ad00-40a0-be16-97a65741c5fe

DROPBOX_DEST_FOLDER=/Users/kelly/Dropbox/dvimports

# test:
# 	@echo $(FLAC_FILES)

# all: $(DEST_FILES1) $(DEST_FILES2)
#      @echo "Done"

# $(SRC_DIR)/%.eps : $(SRC_DIR)/%.png
#     convert -format eps $< $@

# $(SRC_DIR)/%.eps : $(SRC_DIR)/%.jpeg
#     convert -format eps $< $@

test:
	@echo $(MP3_FILES) $(S3_FILES)

# 		BASEDIR="$(DVIMPORTS)"; \
# 		TARGET="$<" \
# 		TARGETLEN=$${#TARGET} \
# 		BASELEN=$${#BASEDIR} \
# 		((BASELEN += 2));
# 		echo $$BASEDIR; \
# 		echo $$TARGETDIR; \
# 		echo $$BASELEN; \
# 		echo $$TARGETLEN;
# 		S3_KEY=`echo $$TARGETDIR | cut -c $${#BASELEN}-$${#TARGETLEN}` \
# 		echo $$S3_KEY;

.PHONY: all
.PRECIOUS: $(CONCAT_MP4S) $(CONCAT_MP4_DESCRIPTIONS)
all: $(MP3_FILES) $(S3_FILES)

%-yt.mp4: %
	@find $< -type f -name '*.mp4' -print0 | xargs -0 stat -f "file '%N' " | sort > $</mp4_files.txt && \
	ffmpeg -safe 0 -f concat -i $</mp4_files.txt -c copy $@

%-yt.txt: %
	@find $< -type f -name '*.mp4' -print0 | xargs -0 stat -f "%N" | sort > $@

# youtube-prep: $(CONCAT_MP4S) $(CONCAT_MP4_DESCRIPTIONS)

%-yt.json: %-yt.mp4 %-yt.txt
	@echo "uploading $< to YouTube" && \
	cd youtube && node lib/puppeteer2.js $(CHROME_WS) "$<" > "$@" && cd .. && \
	cat "$@" | jq -r .id

youtube-prep: $(CONCAT_MP4_DESCRIPTIONS) $(CONCAT_MP4S)

youtube: $(CONCAT_MP4_UPLOADS)

%-dropbox: %
	@FILE="$<-yt.mp4"; \
	if [[ -f "$$FILE" ]]; then \
		mv $< $(DROPBOX_DEST_FOLDER); \
	fi

dropbox: $(DROPBOX_FOLDERS)

%.s3: %.dv
	@IS_OPEN=$(shell fuser "$<" 2>/dev/null) && \
	if [[ -n "$$IS_OPEN" ]]; then \
		echo "skipping open $<"; \
	else \
		echo "uploading $< to S3" && \
		TARGETLEN=`echo $< | wc -c | xargs` \
		BASELEN=`echo $(DVIMPORTS) | wc -c | xargs` \
		BASELEN=`expr $$BASELEN + 1` \
		S3_KEY=`echo $< | cut -c $$BASELEN-$$TARGETLEN`; \
		aws s3 cp $< s3://$(S3_BUCKET)/$$S3_KEY && \
		touch $@; \
	fi

%.mp4: %.dv
	@echo $< && IS_OPEN=$(shell fuser "$<" 2>/dev/null) && echo $$IS_OPEN && \
	if [[ -n "$$IS_OPEN" ]]; then \
		echo "skipping open $<"; \
	else \
		echo "converting $<" && \
		mkdir -p "$(@D)" && \
 	  ffmpeg -i "$<" -vf bwdif -c:v libx264 -keyint_min 1 -x264opts 'keyint=1' -refs 0 -qp 30 "$@"; \
	fi
# 	@mkdir -p "$(@D)"
# 	@ffmpeg -i "$<" -vf bwdif -c:v libx264 -keyint_min 1 -x264opts 'keyint=1' -refs 0 -qp 30 "$@"

sync-youtube: $(YT_FILES)

%.yt.json: %.mp4
	@IS_OPEN=$(shell fuser "$<" 2>/dev/null) && \
	if [[ -n "$$IS_OPEN" ]]; then \
		echo "skipping open $<"; \
	else \
		echo "uploading $< to YouTube" && \
		cd youtube && node lib/puppeteer.js $(CHROME_WS) "$<" > "$@" && cd .. && \
		cat "$@" | jq -r .id; \
	fi

# Make cannot handle spaces in filenames, so temporarily rename them
nospaces:
	rename -v 's/ /%20/g' *\ *
	find . -type f -name '*.dv' | xargs rename -v 's/ /%20/g' *\ *
# After Make is done, rename files back to having spaces
yesspaces:
	find . -type f -name '*.dv' | xargs rename -v 's/%20/ /g' *%20*
	rename -v 's/%20/ /g' *%20*

# replace the semicolon with a colon
# find . -type f -name '*.dv' | xargs rename -v 's/;/:/g' *\ *