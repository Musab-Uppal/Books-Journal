import "@/styles/globals.css";
import Head from "next/head";
import { AppProviders } from "@/components/AppProviders";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Keep It Booked</title>
        <meta
          name="description"
          content="Track books, ratings, and notes with Keep It Booked"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AppProviders>
        <Component {...pageProps} />
      </AppProviders>
    </>
  );
}
