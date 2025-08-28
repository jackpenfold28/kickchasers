export function setClubColours(primary:string, secondary:string){
  const r=document.documentElement; r.style.setProperty('--team-primary',primary); r.style.setProperty('--team-secondary',secondary);
}
