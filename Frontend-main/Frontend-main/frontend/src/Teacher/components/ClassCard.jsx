import { Link } from "react-router-dom";

const Card = ({ className = "", children }) => {
  return (
    <div className={`bg-white shadow rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
};

const CardContent = ({ children }) => {
  return <div className="text-gray-800">{children}</div>;
};

const ClassCard = ({ course }) => {
  return (
    <Link to={`/teacher/classroom/${course.id}`}>
      <Card className="w-full max-w-md bg-white shadow-md rounded-2xl p-4">
        <CardContent>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold">
              {course.title.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{course.title}</h2>
              <p className="text-sm text-gray-500">Code: {course.code}</p>
            </div>
          </div>

          <p className="text-gray-700 mb-1">
            Batch: {course?.batch} ({course.semester})
          </p>
          <p className="text-gray-700 mb-1">Type: {course?.type}</p>
          <p className="text-gray-700 mb-1">Students: {course?.num_students}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ClassCard;
