export default function FloatingElement({children,delay=0,className=''}){return <div className={'floating-element '+className} style={{animationDelay:delay+'s'}}>{children}</div>;}
