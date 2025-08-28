export default function ThemeToggle(){
  function toggle(){
    const html=document.documentElement
    if(html.classList.contains('dark')){html.classList.remove('dark');html.classList.add('light');localStorage.setItem('theme','light')}
    else{html.classList.add('dark');html.classList.remove('light');localStorage.setItem('theme','dark')}
  }
  const label=(typeof document!=='undefined' && document.documentElement.classList.contains('dark'))?'Dark mode':'Light mode'
  return <button className="btn" onClick={toggle}>{label}</button>
}
