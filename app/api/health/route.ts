import { NextResponse } from "next/server";
export async function GET(){return NextResponse.json({ok:true,service:"jay-boys-hostel",node:process.version,timestamp:new Date().toISOString()})}
