import { SVGProps } from 'react'

const AddIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		{...props}
	>
		<title>Plus icon</title>
		<path fill="currentColor" d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2z" />
	</svg>
)

const AnalyzeIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		{...props}
	>
		<title>Analyze icon</title>
		<path
			fill="currentColor"
			d="M7.75 17.115V6.885h1v10.23zM11.5 21V3h1v18zM4 13.308v-2.616h1v2.616zm11.25 3.807V6.885h1v10.23zM19 13.308v-2.616h1v2.616z"
		/>
	</svg>
)

const ChevronIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		{...props}
	>
		<title>Chevron icon</title>
		<path
			fill="currentColor"
			d="M13.292 12L9.046 7.754q-.14-.14-.15-.344q-.01-.204.15-.364t.354-.16q.194 0 .354.16l4.388 4.389q.131.13.184.267q.053.136.053.298t-.053.298q-.053.137-.184.267l-4.388 4.389q-.14.14-.344.15q-.204.01-.364-.15t-.16-.354q0-.194.16-.354z"
		/>
	</svg>
)

const CheckIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		{...props}
	>
		<title>Check icon</title>
		<path
			fill="currentColor"
			d="m10 14.312l6.246-6.266q.139-.14.353-.14t.355.139q.14.139.14.354q0 .214-.14.355l-6.389 6.37q-.242.241-.565.241q-.323 0-.565-.242l-2.389-2.37q-.14-.138-.14-.352t.139-.355q.139-.14.354-.14q.214 0 .355.14z"
		/>
	</svg>
)

const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		{...props}
	>
		<title>Search icon</title>
		<path
			fill="currentColor"
			d="M9.538 15.23q-2.398 0-4.064-1.666T3.808 9.5q0-2.398 1.666-4.064t4.064-1.667q2.399 0 4.065 1.667q1.666 1.666 1.666 4.064q0 1.042-.369 2.017q-.37.975-.97 1.668l5.908 5.907q.14.14.15.345q.01.203-.15.363q-.16.16-.353.16q-.195 0-.354-.16l-5.908-5.908q-.75.639-1.725.989q-.975.35-1.96.35m0-1q1.99 0 3.361-1.37q1.37-1.37 1.37-3.361q0-1.99-1.37-3.36q-1.37-1.37-3.36-1.37q-1.99 0-3.361 1.37q-1.37 1.37-1.37 3.36q0 1.99 1.37 3.36q1.37 1.37 3.36 1.37"
		/>
	</svg>
)

export { AddIcon, AnalyzeIcon, ChevronIcon, CheckIcon, SearchIcon }
