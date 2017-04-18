cd /home/alarm/ytterbic-kiwi
modprobe bcm2835-v4l2
sleep 1
sudo chmod a+rw /dev/video*
nodemon index.js &
startx&
