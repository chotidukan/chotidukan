import type {Metadata,Viewport}from 'next';import './globals.css';import Shell from './shell';import {currentUser}from '../lib/auth';import {isSupabaseConfigured}from '../lib/supabase/server';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#214f3c'};
export const metadata:Metadata={title:'ChotiDukan — Your neighbourhood, delivered',description:'Fresh groceries from independent stores near you. Shop groceries, subscribe to essentials and support your neighbourhood.',icons:{icon:'/favicon.svg'}};
export default async function RootLayout({children}:{children:React.ReactNode}){const user=isSupabaseConfigured()?await currentUser():null;return <html lang="en"><body><Shell signedIn={!!user}>{children}</Shell></body></html>;}
