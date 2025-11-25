import type { SVGAttributes } from 'react'

const TrefaLogo = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg
      width='1em'
      height='1em'
      viewBox='0 0 200 60'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <text
        x='10'
        y='40'
        fontFamily='Arial, sans-serif'
        fontSize='48'
        fontWeight='bold'
        fill='currentColor'
      >
        TREFA
      </text>
    </svg>
  )
}

export default TrefaLogo
