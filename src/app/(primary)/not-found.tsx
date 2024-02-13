export default function NotFoundPage() {
  return (
    <div className="container flex-1 pt-24 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold md:text-4xl mb-4">
        404 - Page Not Found
      </h1>
      <p className="max-w-[700px] text-lg text-muted-foreground">
        Looks like there is nothing here. Go back and try again.
      </p>
    </div>
  );
}
