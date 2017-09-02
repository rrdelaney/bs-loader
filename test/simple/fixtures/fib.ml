external dec : int -> int = "dec" [@@bs.module "./dec"]
open Add

let fib n  =
  let rec aux n a b =
    if n = 0 then a
    else
      aux (dec n) b (add a b)
  in aux n 1 1
