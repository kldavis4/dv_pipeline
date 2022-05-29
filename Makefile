# SRC_DIR=.
# SRC_FILES = $(shell find . -type f -name '*.dv')

# DEST_FILES = $(patsubst $(SRC_DIR)/%.dv,$(SRC_DIR)/%.mp4,$(SRC_FILES))
# DEST_FILES2 = $(patsubst $(SRC_DIR)/%.jpeg,$(SRC_DIR)/%.eps,$(SRC_FILES2))

# FLAC_FILES = $(shell find . -printf "\"%p\" " -type f -name '*.dv')
FLAC_FILES = $(shell find dv -type f -name '*.dv')
MP3_FILES = $(patsubst dv/%.dv,mp4/%.mp4,$(FLAC_FILES))

# test:
# 	@echo $(FLAC_FILES)

# all: $(DEST_FILES1) $(DEST_FILES2)
#      @echo "Done"

# $(SRC_DIR)/%.eps : $(SRC_DIR)/%.png
#     convert -format eps $< $@

# $(SRC_DIR)/%.eps : $(SRC_DIR)/%.jpeg
#     convert -format eps $< $@

# test:
# 	@echo $(MP3_FILES)

test:
	@echo  $(MP3_FILES)

.PHONY: all
all: $(MP3_FILES)

mp4/%.mp4: dv/%.dv
	@mkdir -p "$(@D)"
	@ffmpeg -i "$<" -vf bwdif -c:v libx264 -keyint_min 1 -x264opts 'keyint=1' -refs 0 -qp 30 "$@"

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