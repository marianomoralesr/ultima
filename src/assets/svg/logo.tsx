// React Imports
import type { SVGAttributes } from 'react'

const Logo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg
      width='1em'
      height='1em'
      viewBox='0 0 200 50'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      {/* TREFA Logo - Orange Theme */}
      <text
        x='10'
        y='35'
        fontFamily='Arial, sans-serif'
        fontSize='32'
        fontWeight='bold'
        fill='currentColor'
      >
        TREFA
      </text>
      <circle cx='170' cy='25' r='8' fill='#ea580c' />
    </svg>
  )
}

export default Logo
