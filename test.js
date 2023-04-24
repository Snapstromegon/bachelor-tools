const fac = n => n == 0 ? 1 : n * fac(n - 1);

function a(n) {
  
  return fac(n+1) * 3;
}

for (let i = 0; i <= 4; i++) {
  console.log(i, a(i));
}
