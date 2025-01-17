import React from "react";
import PropTypes from "prop-types";
import Footer from "../Footer";
import Head from "next/head";
import SkipLink from "../SkipLink";
import AdminNav from "../AdminNav";
import { User } from "next-auth";

import { LeftNavigation } from "@components/admin/LeftNav/LeftNavigation";

interface AdminNavLayoutProps extends React.PropsWithChildren {
  user: User;
}

const AdminNavLayout = ({ children, user }: AdminNavLayoutProps) => {
  return (
    <div className="flex flex-col h-full">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta charSet="utf-8" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" sizes="32x32" />
      </Head>

      <SkipLink />

      <header className="border-b-1 border-gray-500 mb-12 py-2 px-4 laptop:px-32 desktop:px-64">
        <AdminNav user={user} />
      </header>

      <div className="page-container mx-4 laptop:mx-32 desktop:mx-64 grow shrink-0 basis-auto">
        <LeftNavigation />
        <main id="content" className="ml-40 laptop:ml-60">
          {children}
        </main>
      </div>

      <Footer displayFormBuilderFooter />
    </div>
  );
};

AdminNavLayout.propTypes = {
  children: PropTypes.object.isRequired,
};

export default AdminNavLayout;
