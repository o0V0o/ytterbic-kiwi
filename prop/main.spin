

CON
    _clkmode = xtal1 + pll16x                           
    _xinfreq = 5_000_000                                'Note Clock Speed for your setup!!

    Servo1 = 16                                       
    ESC = 17
    
    BAUD = 115200
    
    I2C_ID= $42
    I2C_SCL = 2
    I2C_SDA = 3

dat 
    width long 0[10]
    ComCog long 0

obj


  Com   : "FullDuplexSerial_rr004" 
  SERVO : "Servo32v9.spin"
  I2C   : "I2C slave v1.2"
  

pub main
  
    init   
    
    SERVO.Set(Servo1,1000)                  'Move Servo to Center
    waitms(500)          
    'repeat
             'SetRamp(Pin, Width,Delay)<-- 100 = 1 sec 6000 = 1 min   (actually seems 200=1sec)  
        SERVO.SetRamp(Servo1,2000,180)          
        waitms(1000)        
    
        SERVO.SetRamp(Servo1,1000,180)          
        waitms(1000)
                                                  
   ' SERVO.Set(Servo1,1500)                  'Force Servo to Center 
   ' waitms(500)


'repeat
'    SERVO.SetRamp(ESC, 1500, 50)      
'        waitms(500)
'    SERVO.SetRamp(ESC, 1700, 50)    
'        waitms(500)
'    SERVO.SetRamp(ESC, 1000, 50)    
'        waitms(500)
'    SERVO.SetRamp(ESC, 1700, 50)
'    
'    
'    




'repeat
'    SERVO.SetRamp(Servo1,2000,180)             
'    SERVO.SetRamp(ESC, 1100, 200)   
'        waitms(1000)
'    SERVO.SetRamp(Servo1,1000,180)          
'     SERVO.SetRamp(ESC, 1700, 200)   
'        waitms(1000)

    memoryMapLoop
pub init
    SERVO.Start 
    SERVO.Ramp 
    dira[Servo1] := 1
    dira[ESC] := 1
    
    I2C.Start(I2C_SCL,I2C_SDA,I2C_ID)                                              ' Start the slave object with a device address of $42
    defaults
    
    ComCog:=Com.Start(31,30,%0000,BAUD)

pub defaults | register
    'register := I2C.register 'address of the I2C register
                             '
    'byte[register][0] := 2000   ' test servo
    'byte[register][1] := 1500   ' ESC speed
                                ' 
    I2C.Put(1, 200)
    I2C.Put(2, 150)
    
pub servoPos(inByte)    ' go from single byte position to pulse size
    return inByte * 10
pub escPos(inByte)      ' go from single byte speed to pulse size
    return inByte * 10
pub memoryMapLoop | register 'map values of the i2c registers to real things
    register := I2C.register 'address of the I2C register
    
    
    repeat
        Com.str(String("Servo Pos:"))
        Com.dec(I2C.Get(1))
        Com.tx(13)
        SERVO.Set(Servo1,   servoPos(I2C.Get(1))) 
        SERVO.Set(ESC,      escPos(I2C.Get(2)))
        waitms(100)
        
        
pub WaitMS(MS)                
  waitcnt(((clkfreq/1000) * MS) +cnt) 'wait for a specified number of MS        