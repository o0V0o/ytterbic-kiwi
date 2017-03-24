

CON
    _clkmode = xtal1 + pll16x                           
    _xinfreq = 5_000_000                                'Note Clock Speed for your setup!!

    ServoCh1 = 4                                        'Select DEMO servo

dat 
    width long 0[10]

obj


  Com   :       "FullDuplexSerial_rr004" 
  SERVO : "Servo32v9.spin"
  I2C   : 
  
  
pub main
  
      SERVO.Start                 'Start Servo handler
    SERVO.Ramp  '<-OPTIONAL     'Start Background Ramping

                                'Note: Ramping requires another COG
                                '      If ramping is not started, then
                                '      'SetRamp' commands within the
                                '      program are ignored
                                '
                                'Note: At ANY time, the 'Set' command overides
                                '      the servo position.  To 'Ramp' from the
                                '      current position to the next position,
                                '      you must use the 'SetRamp' command 

         'Set(Pin, Width)
    dira[2]:=1     '
    dira[3]:=1     '
    dira[4]:=1     '
                   '
    outa[2]:=0
    outa[3]:=1
    outa[4]:=0
    
    SERVO.Set(ServoCh1,1000)                  'Move Servo to Center

    repeat 1500000                            'Do nothing here just to wait for
                                              'background ramping to complete
    

         'SetRamp(Pin, Width,Delay)<-- 100 = 1 sec 6000 = 1 min    
    SERVO.SetRamp(ServoCh1,2000,200)          'Pan Servo          

    repeat 1500000                            'Do nothing here just to wait for
                                              'background ramping to complete
    
    SERVO.SetRamp(ServoCh1,1000,50)           'Pan Servo          

    repeat 800000                             'Do nothing here just to wait for          
                                              'background ramping to complete
                                              
    SERVO.Set(ServoCh1,1500)                  'Force Servo to Center 



  
  ComCog:=Com.Start(31,30,%0000,BAUD)    
  
  doloop()
     
  if  ComCog== 0
    repeat                   
      Com.str(String ("MCOG:"))
      Com.dec(ComCog)
    return 0

  repeat
    Com.str(String (" BadDownload "))
  
pub doloop | todo, high, low, rhigh, rlow


        
pri Read | c, bytrd
{{ reads in all characters in the rx buffer }}  
  bytrd:=0
  repeat   
    if Q.isFull==1
      ExData[0]:=Q.gethead
      ExData[1]:=Q.getTail
      sendKey(String("Full"), 4, @ExData, 2, 1)
      c:=-1 ' Full. done with loop. 
    else ' otherwise, read in next char.  
      c:=Com.rxcheck
      if c<>-1             
     
        Q.insert(c)
        bytrd++   
  until c==-1
  if  bytrd > 0 
    if BUFDUMP > 0
      lock  
      Com.str( String("<buffer:'") )
      echoQ  
      Com.str( String("'>") )
      clear  

  return bytrd                         
pub WaitMS(MS)                
  waitcnt(((clkfreq/1000) * MS) +cnt) 'wait for a specified number of MS        