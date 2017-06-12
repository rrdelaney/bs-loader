open Jest;

test
  "addition"
  (
    fun () => {
      open Expect;
      let num1 = 1;
      let num2 = 3;
      expect (Add.add num1 num2) |> toBe 4
    }
  );
