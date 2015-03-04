


    client ---(socks)---> protun-tunnel
                               |
                               |
                             (http)
                               |
                               |
                          protun-relay ---(tcp/udp)--->


SOCKS:

1. client:CREATED   ----(select-method-req)------->    server

2.                 <---(method-selected-rep)------

3. client:MSELECTED   -----(cmd:CONNECT)---------->   server

4.                 <--------(reply)--------------

5.