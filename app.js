const pages=[...document.querySelectorAll(".page")];
function go(page){pages.forEach(p=>p.classList.toggle("active",p.id===page));document.querySelectorAll("[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
const modal=document.getElementById("modal"), qty=document.getElementById("qty"), total=document.getElementById("total");
let n=1;
function update(){qty.textContent=n;total.textContent=(n*100).toLocaleString("ar-EG")+" ج.م"}
document.getElementById("investBtn").onclick=()=>modal.classList.add("show");
document.getElementById("close").onclick=()=>modal.classList.remove("show");
document.getElementById("minus").onclick=()=>{n=Math.max(1,n-1);update()};
document.getElementById("plus").onclick=()=>{n++;update()};
document.getElementById("confirm").onclick=()=>{alert("هذه نسخة الويب التجريبية. سيتم ربط التنفيذ الفعلي بالـBackend بعد نشره.");modal.classList.remove("show")};
document.getElementById("profileBtn").onclick=()=>alert("صفحة الحساب ستتصل لاحقًا بنظام تسجيل الدخول والـKYC.");
