

import React from 'react'


type componentProps = {
    url: string
    height?: string
}

export default function EmbedVideo({ url, height = "h-[15rem]" }: componentProps) {
    
    const video = url?.split("=")[1]

    return (<div className={`${height} relative`}>
        <iframe src={`https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D${video}&key=925108d922be940af814f71907a7df4b`} style={{ top: 0, left: 0, borderRadius: '0.5rem', width: "100%", height: "100%", position: "absolute", border: 0 }} allow="accelerometer *; clipboard-write *; encrypted-media *; gyroscope *; picture-in-picture *; web-share *;"></iframe>
    </div>)
}

{/* <div><div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;"><iframe src="https://cdn.iframe.ly/api/iframe?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DCFbHqKDcTuk&key=925108d922be940af814f71907a7df4b" style="top: 0; left: 0; width: 100%; height: 100%; position: absolute; border: 0;" allowfullscreen scrolling="no" allow="accelerometer *; clipboard-write *; encrypted-media *; gyroscope *; picture-in-picture *; web-share *;"></iframe></div><a href="https://embedcodesgenerator.com" rel="noopener" target="_blank" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">embedcodesgenerator.com</a></div> */ }