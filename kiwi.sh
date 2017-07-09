cd /home/alarm/ytterbic-kiwi
modprobe bcm2835-v4l2
sleep 1
sudo chmod a+rw /dev/video*
sudo chmod a+rw /dev/spi*
nodemon index.js &
startx&
