include ../defines.mk

IMAGES=pmx-clear-trigger.png		\
       openid-icon-100x100.png		\
       icon-cpu.svg			\
       icon-ram.svg			\
       debian-swirl-openlogo.svg	\
       proxmox-symbol-x.svg		\

all:

.PHONY: install
install: $(IMAGES)
	install -d $(WWWIMAGESDIR)
	for i in $(IMAGES); do install -m 0644 $$i $(WWWIMAGESDIR)/$$i; done

.PHONY: clean
clean:
