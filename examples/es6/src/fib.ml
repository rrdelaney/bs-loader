let fib n  =
  let rec aux n a b =
    if n = 0 then a
    else
      aux (n - 1) b (a+b)
  in aux n 1 1
